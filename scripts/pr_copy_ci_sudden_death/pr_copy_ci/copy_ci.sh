#!/usr/bin/env bash
set -euo pipefail

# Validate every required source before deleting any generated files. Assign the
# output first so a preflight failure cannot be hidden by process substitution.
manifest_reader="$(dirname "${BASH_SOURCE[0]}")/read_manifest.mjs"
files="$(node "${manifest_reader}" files)"
excluded_workflows="$(node "${manifest_reader}" excludeWorkflows)"
command -v yq >/dev/null
requires_python="$(grep '^requires-python = ' hato-bot/pyproject.toml)"
required_version="$(grep '^required-version = ' hato-bot/pyproject.toml)"

is_excluded_workflow() {
	local name="${1##*/}"
	local pattern
	# These files belong to sudden-death even if an upstream file has that name.
	if [[ "${name}" == *sudden-death.yml || "${name}" == verify-lockfile.yml ]]; then
		return 0
	fi
	while IFS= read -r pattern; do
		if [[ "${name}" == ${pattern} ]]; then
			return 0
		fi
	done <<<"${excluded_workflows}"
	return 1
}

workflows_path=.github/workflows
find sudden-death/${workflows_path} -type f \
	\( -name "*.yml" -o -name "*.yaml" \) \
	-not -name "*sudden-death.yml" \
	-not -name "verify-lockfile.yml" \
	-exec rm -f {} \;

while IFS= read -r -d '' source; do
	f="${source#hato-bot/${workflows_path}/}"
	if is_excluded_workflow "${f}"; then
		continue
	fi
	mkdir -p "sudden-death/${workflows_path}/$(dirname "${f}")"
	yq '(.jobs.* | select(has("steps")).steps.[] | select(has("with")).with | select(has("repo-name")).repo-name) = "dev-hato/sudden-death"' "hato-bot/${workflows_path}/${f}" >"sudden-death/${workflows_path}/${f}"
done < <(find "hato-bot/${workflows_path}" -type f \( -name "*.yml" -o -name "*.yaml" \) -print0)
while IFS= read -r -d '' f; do
	if [[ "${f}" != *sudden_death* ]]; then
		rm -f "${f}"
	fi
done < <(find sudden-death/scripts -type f -print0)
while IFS= read -r -d '' source; do
	if [[ "${source}" == *hato_bot* || "${source}" == *sudden_death* ]]; then
		continue
	fi
	f="${source#hato-bot/}"
	mkdir -p "sudden-death/$(dirname "${f}")"
	cp "${source}" "sudden-death/${f}"
done < <(find hato-bot/scripts -type f -print0)

while IFS= read -r f; do
	mkdir -p "sudden-death/$(dirname "${f}")"
	cp "hato-bot/${f}" "sudden-death/${f}"
done <<<"${files}"

sed -i -e "s/requires-python = .*/${requires_python}/g" sudden-death/pyproject.toml
sed -i -e "s/required-version = .*/${required_version}/g" sudden-death/pyproject.toml
