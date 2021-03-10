from jinja2 import Markup
from lektor.pluginsystem import Plugin
import requests


_fb_import_js = """
<div id="fb-root"></div>
<script
    src="https://connect.facebook.net/en_GB/sdk.js#xfbml=1&amp;version=v10.0"
></script>
"""


_fb_embed_template = """
<div
    class="fb-video"
    data-href="{url}"
    data-width="640px"
    data-show-text="false"
    data-allowfullscreen="true"
>
  <div class="fb-xfbml-parse-ignore">
    <div class="button-container">
      <a class="button" href="{url}">Video</a>
    </div>
  </div>
</div>
"""


def _facebook_video(url):
    r = requests.get(url, allow_redirects=False)
    if r.status_code in [301, 302]:
        return Markup(_fb_embed_template.format(url=r.headers["location"]))
    return Markup(_fb_embed_template.format(url=url))


def _import_facebook_video():
    return Markup(_fb_import_js)


class FacebookVideoEmbedPlugin(Plugin):
    name = "lektor-facebook-video-embed"

    def on_setup_env(self, **extra):
        self.env.jinja_env.filters["facebook_video"] = _facebook_video
        self.env.jinja_env.globals["import_facebook_video"] = _import_facebook_video
