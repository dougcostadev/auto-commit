"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGit = getGit;
exports.checkGitRepository = checkGitRepository;
exports.getRepositoryInfo = getRepositoryInfo;
exports.getUntrackedFiles = getUntrackedFiles;
exports.addFiles = addFiles;
exports.createCommit = createCommit;
exports.pushToRemote = pushToRemote;
exports.isGitLockActive = isGitLockActive;
exports.removeGitLock = removeGitLock;
const simple_git_1 = require("simple-git");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
let git;
function getGit() {
    if (!git) {
        git = (0, simple_git_1.simpleGit)();
    }
    return git;
}
async function checkGitRepository() {
    try {
        const git = getGit();
        await git.status();
        return true;
    }
    catch {
        return false;
    }
}
async function getRepositoryInfo() {
    const git = getGit();
    try {
        const [status, remotes, branch] = await Promise.all([
            git.status(),
            git.getRemotes(true),
            git.branch()
        ]);
        let repoName = path_1.default.basename(process.cwd());
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
    }
    catch (error) {
        throw new Error(`Failed to get repository info: ${error}`);
    }
}
async function getUntrackedFiles() {
    const git = getGit();
    try {
        const status = await git.status();
        return status.not_added;
    }
    catch (error) {
        throw new Error(`Failed to get untracked files: ${error}`);
    }
}
async function addFiles(files) {
    const git = getGit();
    try {
        await git.add(files);
    }
    catch (error) {
        throw new Error(`Failed to add files: ${error}`);
    }
}
async function createCommit(message) {
    const git = getGit();
    try {
        const result = await git.commit(message);
        return result.commit;
    }
    catch (error) {
        throw new Error(`Failed to create commit: ${error}`);
    }
}
async function pushToRemote(remote = 'origin', branch) {
    const git = getGit();
    try {
        if (!branch) {
            const branchInfo = await git.branch();
            branch = branchInfo.current;
        }
        await git.push(remote, branch);
    }
    catch (error) {
        throw new Error(`Failed to push to remote: ${error}`);
    }
}
async function isGitLockActive() {
    try {
        const lockPath = path_1.default.join(process.cwd(), '.git', 'index.lock');
        await fs_1.promises.access(lockPath);
        return true;
    }
    catch {
        return false;
    }
}
async function removeGitLock() {
    try {
        const lockPath = path_1.default.join(process.cwd(), '.git', 'index.lock');
        await fs_1.promises.unlink(lockPath);
    }
    catch {
    }
}
//# sourceMappingURL=git.js.map