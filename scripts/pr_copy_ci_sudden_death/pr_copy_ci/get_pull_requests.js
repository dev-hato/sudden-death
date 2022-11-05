module.exports = async ({ github, context }) => {
  const pulls_list_params = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${process.env.ORG_NAME}:pr-copy-ci`,
    base: "master",
    state: "open"
  }
  console.log("call pulls.list:", pulls_list_params)
  const pulls = await github.paginate(github.rest.pulls.list, pulls_list_params)
  return pulls.filter(data => data.user.id === 41898282).length
}
