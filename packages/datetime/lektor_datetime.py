from lektor.pluginsystem import Plugin
from datetime import datetime


def parse_date(str_date, fmt):
    return datetime.strptime(str_date, fmt)


class DatetimePlugin(Plugin):
    def on_process_template_context(self, context, **extra):
        context['parse_date'] = parse_date
