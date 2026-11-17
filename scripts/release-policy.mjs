import {readFileSync} from 'node:fs';

export function releaseContext(env, event) {
  if (env.GITHUB_REPOSITORY !== 'kaj-jensen/cumbuco-net-br') throw new Error('Unexpected repository');
  if (!/^[a-f0-9]{40}$/.test(env.RELEASE_SHA || '')) throw new Error('Missing exact release commit');
  if (env.GITHUB_EVENT_NAME === 'pull_request') {
    const pr = event.pull_request;
    if (pr?.head?.repo?.full_name !== env.GITHUB_REPOSITORY || env.GITHUB_ACTOR === 'dependabot[bot]' ||
        pr.state !== 'open' || pr.head.sha !== env.RELEASE_SHA || !Number.isSafeInteger(event.number) ||
        String(event.number) !== env.PR_NUMBER) throw new Error('Untrusted or stale preview event');
    return {preview: true, number: event.number, sha: env.RELEASE_SHA};
  }
  if (!['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME) || env.GITHUB_REF !== 'refs/heads/codex/initial-build') {
    throw new Error('Production releases require main');
  }
  return {preview: false, sha: env.RELEASE_SHA};
}

export function currentReleaseContext() {
  return releaseContext(process.env, JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')));
}

export function previewURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+-cumbuco-net-br\.kaj-jensen-d29\.workers\.dev$/.test(url.hostname) ||
      url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Unexpected cumbuco-net-br preview URL');
  }
  return url.origin;
}
