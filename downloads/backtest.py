"""教学模拟，非真实历史行情。Python 3.10+，运行 python backtest.py。"""
from pathlib import Path
import argparse
import math
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

BASE = Path(__file__).resolve().parent

def load_prices(path):
    raw = pd.read_csv(path, comment='#', parse_dates=['date'])
    if raw['date'].isna().any() or raw['date'].duplicated().any():
        raise ValueError('日期无效或重复，请核对原始数据')
    prices = raw.set_index('date')[['asset_a', 'asset_b']].sort_index()
    if len(prices) < 2 or not np.isfinite(prices.to_numpy(dtype=float)).all() or (prices <= 0).any().any():
        raise ValueError('至少需要两行有效的正价格，不自动填充缺失值')
    return prices

def xirr(cashflows):
    """仅支持先投入、最终一次正值结算；实际天数 / 365，失败显式抛错。"""
    flows = sorted(cashflows, key=lambda x: x[0])
    if len(flows) < 2 or flows[-1][1] <= 0 or any(v >= 0 for _, v in flows[:-1]):
        raise ValueError('XIRR 需要负投入和最终正结算，且仅支持此现金流结构')
    years = np.array([(d - flows[0][0]).days / 365 for d, _ in flows])
    if years[-1] <= 0:
        raise ValueError('XIRR 需要正的持有期限')
    amounts = np.array([v for _, v in flows], dtype=float)
    def npv(rate):
        return float(np.sum(amounts / np.power(1 + rate, years)))
    lo, hi = -0.999999, 1.0
    while npv(hi) > 0 and hi < 1e10:
        hi = hi * 2 + 1
    if not (npv(lo) >= 0 and npv(hi) <= 0):
        raise ValueError('XIRR 在数值搜索区间内没有找到根')
    for _ in range(200):
        mid = (lo + hi) / 2
        if npv(mid) > 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

def simulate(prices, weights, monthly=1000):
    if not isinstance(prices, pd.DataFrame) or len(prices) < 2:
        raise ValueError('至少需要两个不同日期的价格记录')
    if not isinstance(prices.index, pd.DatetimeIndex) or prices.index.isna().any():
        raise ValueError('索引必须为有效日期，不允许 NaT')
    if prices.index.has_duplicates or not prices.index.is_monotonic_increasing:
        raise ValueError('日期必须唯一且严格升序')
    if (prices.index[-1] - prices.index[0]).days <= 0:
        raise ValueError('不可计算：持有期限必须至少跨越一个日历日')
    try:
        values = prices.to_numpy(dtype=float)
    except (TypeError, ValueError) as exc:
        raise ValueError('价格必须为数值') from exc
    if not np.isfinite(values).all() or (values <= 0).any():
        raise ValueError('价格必须为正有限数，不允许 NaN 或无穷值')
    weights = np.asarray(weights, dtype=float)
    if len(weights) != len(prices.columns) or not np.isfinite(weights).all() or (weights < 0).any() or not np.isclose(weights.sum(), 1):
        raise ValueError('权重必须非负且总和为 1')
    if not math.isfinite(monthly) or monthly <= 0:
        raise ValueError('每月投入必须为正有限数')
    shares = np.zeros(len(weights))
    previous_value, total, nav, previous_month = 0.0, 0.0, 1.0, None
    records, cashflows = [], []
    for date, row in prices.iterrows():
        price = row.to_numpy(dtype=float)
        # 收盘投入：先计算旧份额今日收益，再按当日价格购买新份额。
        before = float(shares @ price)
        daily_return = before / previous_value - 1 if previous_value > 0 else 0.0
        nav *= 1 + daily_return
        month = date.to_period('M')
        contribution = monthly if month != previous_month else 0.0
        if contribution:
            shares += contribution * weights / price
            total += contribution
            cashflows.append((date, -contribution))
        value = float(shares @ price)
        records.append((date, value, total, contribution, daily_return, nav))
        previous_value, previous_month = value, month
    frame = pd.DataFrame(records, columns=['date', 'value', 'contributed', 'cash_in', 'return', 'nav']).set_index('date')
    frame['drawdown'] = frame['nav'] / frame['nav'].cummax() - 1
    cashflows.append((frame.index[-1], float(frame['value'].iloc[-1])))
    days = (frame.index[-1] - frame.index[0]).days
    metrics = {'contributed': total, 'ending_value': float(frame['value'].iloc[-1]),
               'profit': float(frame['value'].iloc[-1] - total),
               'twr_annualized': float(frame['nav'].iloc[-1] ** (365 / days) - 1),
               'annual_volatility_252': float(frame['return'].iloc[1:].std(ddof=1) * np.sqrt(252)) if len(frame) > 2 else np.nan,
               'volatility_status': 'OK' if len(frame) > 2 else '不可计算：至少需要两个有效日收益观测',
               'max_drawdown': float(frame['drawdown'].min())}
    try:
        metrics['xirr'] = xirr(cashflows)
        metrics['xirr_status'] = 'OK'
    except ValueError as exc:
        metrics['xirr'] = np.nan
        metrics['xirr_status'] = '不可计算：' + str(exc)
    return frame, metrics

def self_test():
    dates = pd.bdate_range('2024-01-01', '2024-04-30')
    flat = pd.DataFrame({'asset_a': 100., 'asset_b': 100.}, index=dates)
    frame, metrics = simulate(flat, [.6, .4])
    assert np.isclose(metrics['contributed'], 4000)
    assert np.isclose(metrics['profit'], 0) and np.isclose(metrics['xirr'], 0, atol=1e-8)
    assert np.allclose(frame['nav'], 1) and np.isclose(metrics['max_drawdown'], 0)
    falling = flat.mul(np.linspace(1, .5, len(flat)), axis=0)
    frame, metrics = simulate(falling, [1, 0])
    assert metrics['profit'] < 0 and metrics['xirr'] < 0
    assert np.isclose(metrics['max_drawdown'], -.5)
    assert np.allclose(frame['nav'], falling['asset_a'] / falling['asset_a'].iloc[0])
    growing = flat.mul(np.linspace(1, 1.2, len(flat)), axis=0)
    first, _ = simulate(growing, [.8, .2], 100)
    second, _ = simulate(growing, [.8, .2], 1000)
    assert np.allclose(first['nav'], second['nav'])
    assert np.allclose(second['value'], first['value'] * 10)
    assert np.isclose(xirr([(pd.Timestamp('2023-01-01'), -100), (pd.Timestamp('2024-01-01'), 110)]), .1)
    try:
        xirr([(dates[0], -100), (dates[0], 100)])
        raise AssertionError('同日现金流应报错')
    except ValueError:
        pass
    _, short = simulate(flat.iloc[:2], [1, 0])
    assert np.isnan(short['annual_volatility_252'])
    assert short['volatility_status'].startswith('不可计算')
    invalid_cases = [flat.iloc[:0], flat.iloc[:1], flat.iloc[::-1],
                     flat.set_axis([dates[0]] * len(flat)),
                     flat.set_axis(pd.DatetimeIndex([pd.NaT] + list(dates[1:])))]
    for invalid_value in [0, -1, np.nan, np.inf]:
        bad = flat.copy()
        bad.iloc[0, 0] = invalid_value
        invalid_cases.append(bad)
    for bad in invalid_cases:
        try:
            simulate(bad, [1, 0])
            raise AssertionError('无效输入应被拒绝')
        except ValueError:
            pass
    intraday = flat.iloc[:2].set_axis(pd.to_datetime(['2024-01-01 09:00', '2024-01-01 15:00']))
    try:
        simulate(intraday, [1, 0])
        raise AssertionError('不足一天应拒绝年化')
    except ValueError:
        pass
    print('PASS: 零收益、下跌、投入规模、XIRR、短样本波动状态、空/单行/乱序/重复/NaT/非法价格/不足一天')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--output', type=Path, default=BASE / 'results')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    prices = load_prices(BASE / 'sample_prices.csv')
    args.output.mkdir(parents=True, exist_ok=True)
    results = {}
    fig, axes = plt.subplots(3, 1, figsize=(10, 11))
    for label, weights in [('A100', [1, 0]), ('A80_B20', [.8, .2]), ('A60_B40', [.6, .4]), ('B100', [0, 1])]:
        frame, metrics = simulate(prices, weights)
        results[label] = metrics
        frame.to_csv(args.output / f'{label}.csv', float_format='%.8f')
        axes[0].plot(frame.index, frame['value'], label=label)
        axes[1].plot(frame.index, frame['nav'], label=label)
        axes[2].plot(frame.index, frame['drawdown'] * 100, label=label)
    axes[0].plot(frame.index, frame['contributed'], '--', color='gray', label='Contributions')
    for ax, title in zip(axes, ['SIMULATED: account value and contributions', 'Cash-flow-adjusted NAV (start=1)', 'Drawdown of adjusted NAV (%)']):
        ax.set_title(title)
        ax.legend()
        ax.grid(alpha=.2)
    fig.tight_layout()
    fig.savefig(args.output / 'comparison.png', dpi=160)
    plt.close(fig)
    summary = pd.DataFrame(results).T
    summary.to_csv(args.output / 'summary.csv', na_rep='不可计算')
    print(summary.to_string())
    print('模拟数据；新资金按比例买入，无再平衡；无费用/税/汇率；波动率以252个交易日近似。')

if __name__ == '__main__':
    main()
