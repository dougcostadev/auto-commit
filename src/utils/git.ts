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

export async function addFiles(
  files: string[], 
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  const git = getGit();
  
  try {
    const existingFiles = [];
    for (const file of files) {
      try {
        await fs.access(file);
        existingFiles.push(file);
      } catch {
        console.warn(`Warning: File not found: ${file}`);
      }
    }
    
    if (existingFiles.length === 0) {
      throw new Error('No valid files to add');
    }
    
    const chunkSize = 50; // Safe chunk size for command line
    let processedFiles = 0;
    
    for (let i = 0; i < existingFiles.length; i += chunkSize) {
      const chunk = existingFiles.slice(i, i + chunkSize);
      await git.add(chunk);
      processedFiles += chunk.length;
      
      if (onProgress) {
        onProgress(processedFiles, existingFiles.length);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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