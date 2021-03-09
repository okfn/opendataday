import shutil
import tempfile
import urllib
from PIL import Image


report_template = """
_model: report
---
_template: report.html
---
slug: {slug}
---
data_file: {data_file}
---
year: {year}
"""


redirect_template = """
_model: redirect
---
target: /events/{year}
---
_discoverable: no
"""


def create_report(row, this_year, json_out_file, reports_dir):
    report_dir = reports_dir / row['slug']
    report_dir.mkdir()
    filename = reports_dir / row['slug'] / 'contents.lr'
    print(f"Writing report for '{row['event_name']}'..", end='')
    with open(filename, 'w') as f:
        f.write(
            report_template.format(
                slug=row['slug'],
                data_file=json_out_file.stem,
                year=this_year,
            )
        )
    print('✔️')


def has_report_fields(row):
    return row['has_event_report']


def init_reports_dir(this_year, reports_dir):
    if reports_dir.exists() and reports_dir.is_dir():
        shutil.rmtree(reports_dir)
    reports_dir.mkdir(parents=True)
    filename = reports_dir / 'contents.lr'
    with open(filename, 'w') as f:
        f.write(redirect_template.format(year=this_year))


def save_image(row, images_dir):
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    urllib.request.install_opener(opener)

    local_image_path = images_dir / row['slug']  # to save the file
    relative_image_path = '/' + str(
        local_image_path.relative_to(local_image_path.parent.parent.parent)
    )  # for the <img> tag

    if not row['event_photo_url']:
        return ''

    try:
        with tempfile.NamedTemporaryFile() as tmp:
            print(f"Saving image from {row['event_photo_url']} to {local_image_path}..", end='')
            urllib.request.urlretrieve(row['event_photo_url'], tmp.name)
            img = Image.open(tmp.name)
            # TODO: we could convert or resize the image here
            # for now it is just a straight copy from A to B
            shutil.copyfile(tmp.name, local_image_path)
            print('✔️')
    except (
        # HTTP errors
        ConnectionResetError,
        TimeoutError,
        urllib.request.HTTPError,
        urllib.error.URLError,

        # Image.open will throw IOError if downloaded file is not an image
        IOError
    ):
        print('❌')

    if local_image_path.exists():
        # If we've got an image saved, return it
        # even if we failed to overwrite it with a new one.
        # This should keep the report images working
        # as the external links gradually rot over time.
        return relative_image_path
    return ''

def create_reports(data, this_year, json_out_file, reports_dir, images_dir):
    init_reports_dir(this_year, reports_dir)
    images_dir.mkdir(parents=True, exist_ok=True)
    for row in data:
        if has_report_fields(row):
            row['event_photo_url'] = save_image(row, images_dir)
            create_report(row, this_year, json_out_file, reports_dir)
            row['event_report_url'] = f"/events/{this_year}/reports/{row['slug']}/"
    return data
