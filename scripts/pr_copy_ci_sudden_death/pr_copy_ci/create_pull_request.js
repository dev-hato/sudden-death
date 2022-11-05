module.exports = async ({ github, context }) => {
  const pullsCreateParams = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${process.env.ORG_NAME}:pr-copy-ci`,
    base: 'master',
    title: 'hato-botのCIを反映するよ！',
    body: '鳩の唐揚げおいしい！😋😋😋'
  }
  console.log('call pulls.create:', pullsCreateParams)
  await github.rest.pulls.create(pullsCreateParams)
}
