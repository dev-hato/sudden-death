#!/usr/bin/env bash

workflows_path=.github/workflows
find sudden-death/${workflows_path} -type f \
	-not -name "*sudden-death.yml" \
	-exec rm -f {} \;

for f in $(find hato-bot/${workflows_path} -type f \
	-not -name "*hato-bot.yml" | sed -e "s:hato-bot/${workflows_path}/::g"); do
	yq '(.jobs.*.steps.[] | select(has("with")).with | select(has("repo-name")).repo-name) = "dev-hato/sudden-death"' "hato-bot/${workflows_path}/${f}" >"sudden-death/${workflows_path}/${f}"
done
for f in $(find sudden-death/scripts -type f | grep -v sudden_death); do
	rm -rf "$f"
done
for f in $(find hato-bot/scripts -type f | grep -v hato_bot | sed -e "s:hato-bot/::g"); do
	mkdir -p "sudden-death/$(dirname "${f}")"
	rm -rf "sudden-death/${f}"
	cp "hato-bot/${f}" "sudden-death/${f}"
done

for f in .markdown-lint.yml .python-lint .textlintrc .gitleaks.toml .mypy.ini .pre-commit-config.yaml .pep8 .flake8 .python-black .isort.cfg .prettierignore renovate.json requirements.txt; do
	rm -f "sudden-death/${f}"
	cp hato-bot/${f} sudden-death/
done
PATTERN_AFTER="$(grep click hato-bot/pyproject.toml | sed -e 's/^.*click==\([0-9.]*\)".*$/\1/g')"
sed -i -e "s/click==[0-9.]*\"/click==${PATTERN_AFTER}\"/g" sudden-death/pyproject.toml
