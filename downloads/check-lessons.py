"""按课程顺序运行所有 Python 片段，需在 downloads 目录运行。"""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
lessons = json.loads(Path('../curriculum-3.js').read_text().split(' = ', 1)[1].rstrip(';\n'))
namespace = {}
for lesson in lessons:
    exec(compile(lesson['code'], lesson['id'], 'exec'), namespace)
    print('PASS', lesson['id'])
print('PASS: 全部20课Python片段按顺序执行成功')
