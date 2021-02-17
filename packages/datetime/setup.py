from setuptools import setup, find_packages

setup(
    author='chris48s',
    license='CC0',
    name='lektor-datetime',
    packages=find_packages(),
    py_modules=['lektor_datetime'],
    version='0.1',
    entry_points={
        'lektor.plugins': [
            'datetime = lektor_datetime:DatetimePlugin',
        ]
    }
)
