module.exports = async ({ github, context }) => {
  const pulls_create_params = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${process.env.ORG_NAME}:pr-copy-ci`,
    base: "master",
    title: "hato-botのCIを反映するよ！",
    body: "鳩の唐揚げおいしい！😋😋😋"
  }
  console.log("call pulls.create:", pulls_create_params)
  await github.rest.pulls.create(pulls_create_params)
}
