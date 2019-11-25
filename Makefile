.PHONY: all list build serve install


all: list

list:
	@grep '^\.PHONY' Makefile | cut -d' ' -f2- | tr ' ' '\n'

build:
	npm run build

install:
	pip install -r requirements.txt
	npm install

serve:
	lektor serve
