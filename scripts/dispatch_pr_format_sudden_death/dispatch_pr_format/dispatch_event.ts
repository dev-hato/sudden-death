import type { Context } from "@actions/github/lib/context";
import type { GitHub } from "@actions/github/lib/utils";
import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export async function script(
  github: InstanceType<typeof GitHub>,
  context: Context,
) {
  const actionsCreateWorkflowDispatchParams: RestEndpointMethodTypes["actions"]["createWorkflowDispatch"]["parameters"] =
    {
      owner: context.repo.owner,
      repo: "hato-bot",
      workflow_id: "pr-format.yml",
      ref: "develop",
    };
  console.log("call actions.createWorkflowDispatch:");
  console.log(actionsCreateWorkflowDispatchParams);
  await github.rest.actions.createWorkflowDispatch(
    actionsCreateWorkflowDispatchParams,
  );
}
