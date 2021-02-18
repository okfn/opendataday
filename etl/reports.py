import shutil


report_template = """
_model: report
---
_template: report.html
---
slug: {slug}
---
data_file: {data_file}
"""


redirect_template = """
_model: redirect
---
target: /events/{year}
---
_discoverable: no
"""


def create_report(row, json_out_file, reports_dir):
    report_dir = reports_dir / row['slug']
    report_dir.mkdir()
    filename = reports_dir / row['slug'] / 'contents.lr'
    print(f"Writing report for '{row['event_name']}'..", end='')
    with open(filename, 'w') as f:
        f.write(report_template.format(
                slug=row['slug'],
                data_file=json_out_file.stem,
            )
        )
    print('✔️')


def has_report_fields(row):
    return row['has_event_report']


def init_reports_dir(this_year, reports_dir):
    if reports_dir.exists() and reports_dir.is_dir():
        shutil.rmtree(reports_dir)
    reports_dir.mkdir()
    filename = reports_dir / 'contents.lr'
    with open(filename, 'w') as f:
        f.write(redirect_template.format(year=this_year))


def create_reports(data, this_year, json_out_file, reports_dir):
    init_reports_dir(this_year, reports_dir)
    for row in data:
        if has_report_fields(row):
            create_report(row, json_out_file, reports_dir)
