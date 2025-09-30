import { simpleGit, SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';

export interface RepositoryInfo {
  name: string;
  branch: string;
  remotes: string[];
  isClean: boolean;
  untrackedFiles: number;
}

let git: SimpleGit;

export function getGit(): SimpleGit {
  if (!git) {
    git = simpleGit();
  }
  return git;
}

export async function checkGitRepository(): Promise<boolean> {
  try {
    const git = getGit();
    await git.status();
    return true;
  } catch {
    return false;
  }
}

export async function getRepositoryInfo(): Promise<RepositoryInfo> {
  const git = getGit();
  
  try {
    const [status, remotes, branch] = await Promise.all([
      git.status(),
      git.getRemotes(true),
      git.branch()
    ]);

    let repoName = path.basename(process.cwd());
    
    if (remotes.length > 0) {
      const originUrl = remotes.find(r => r.name === 'origin')?.refs?.fetch;
      if (originUrl) {
        const match = originUrl.match(/\/([^\/]+)\.git$/);
        if (match) {
          repoName = match[1];
        }
      }
    }

    return {
      name: repoName,
      branch: branch.current || 'unknown',
      remotes: remotes.map(r => r.name),
      isClean: status.files.length === 0,
      untrackedFiles: status.not_added.length
    };
  } catch (error) {
    throw new Error(`Failed to get repository info: ${error}`);
  }
}

export async function getUntrackedFiles(): Promise<string[]> {
  const git = getGit();
  
  try {
    const status = await git.status();
    return status.not_added;
  } catch (error) {
    throw new Error(`Failed to get untracked files: ${error}`);
  }
}

export async function addFiles(files: string[]): Promise<void> {
  const git = getGit();
  
  try {
    await git.add(files);
  } catch (error) {
    throw new Error(`Failed to add files: ${error}`);
  }
}

export async function createCommit(message: string): Promise<string> {
  const git = getGit();
  
  try {
    const result = await git.commit(message);
    return result.commit;
  } catch (error) {
    throw new Error(`Failed to create commit: ${error}`);
  }
}

export async function pushToRemote(remote: string = 'origin', branch?: string): Promise<void> {
  const git = getGit();
  
  try {
    if (!branch) {
      const branchInfo = await git.branch();
      branch = branchInfo.current;
    }
    
    await git.push(remote, branch);
  } catch (error) {
    throw new Error(`Failed to push to remote: ${error}`);
  }
}

export async function isGitLockActive(): Promise<boolean> {
  try {
    const lockPath = path.join(process.cwd(), '.git', 'index.lock');
    await fs.access(lockPath);
    return true;
  } catch {
    return false;
  }
}

export async function removeGitLock(): Promise<void> {
  try {
    const lockPath = path.join(process.cwd(), '.git', 'index.lock');
    await fs.unlink(lockPath);
  } catch {
  }
}