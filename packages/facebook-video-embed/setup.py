from setuptools import setup, find_packages

setup(
    author='chris48s',
    license='CC0',
    name='lektor-facebook-video-embed',
    packages=find_packages(),
    py_modules=['lektor_facebook_video_embed'],
    version='0.1',
    entry_points={
        'lektor.plugins': [
            'facebook-video-embed = lektor_facebook_video_embed:FacebookVideoEmbedPlugin',
        ]
    }
)
