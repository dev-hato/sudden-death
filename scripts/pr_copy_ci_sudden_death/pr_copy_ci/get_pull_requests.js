module.exports = async ({ github, context }) => {
  const pullsListParams = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${process.env.ORG_NAME}:pr-copy-ci`,
    base: 'master',
    state: 'open'
  }
  console.log('call pulls.list:', pullsListParams)
  const pulls = await github.paginate(github.rest.pulls.list, pullsListParams)
  return pulls.filter(data => data.user.id === 41898282).length
}
