import {pathToFileURL} from 'node:url';

export function verifyProtection(environment, policies) {
  if (environment.name !== 'TEST' || environment.can_admins_bypass !== false)
    throw new Error('TEST_ENVIRONMENT_BYPASS_OR_NAME_INVALID');
  const review = environment.protection_rules?.find(rule => rule.type === 'required_reviewers');
  if (review?.prevent_self_review !== true || !review.reviewers?.length)
    throw new Error('TEST_REQUIRED_REVIEWERS_MISSING');
  if (environment.deployment_branch_policy?.custom_branch_policies !== true ||
      environment.deployment_branch_policy?.protected_branches !== false ||
      policies.total_count !== 1 || policies.branch_policies?.length !== 1 ||
      policies.branch_policies[0].name !== 'main' || policies.branch_policies[0].type !== 'branch')
    throw new Error('TEST_MAIN_ONLY_POLICY_REQUIRED');
}

export async function verifyRemote(env = process.env, fetcher = fetch) {
  if (env.GITHUB_REPOSITORY !== 'arciero10/gestionale-frontend' ||
      env.GITHUB_EVENT_NAME !== 'workflow_dispatch' || env.GITHUB_REF !== 'refs/heads/main' || !env.GH_TOKEN)
    throw new Error('TEST_DEPLOY_CONTEXT_INVALID');
  const get = async suffix => {
    const response = await fetcher(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/environments/TEST${suffix}`, {
      headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'},
      signal: AbortSignal.timeout(15000), redirect: 'error'
    });
    if (!response.ok) throw new Error(`TEST_PROTECTION_UNVERIFIABLE_HTTP_${response.status}`);
    return response.json();
  };
  verifyProtection(await get(''), await get('/deployment-branch-policies'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await verifyRemote(); console.log('TEST approval protections verified.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
