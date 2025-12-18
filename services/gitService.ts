
import { GitCommit, GitBlameLine, RepoFile, DependencyData } from '../types';

let currentOwner = 'OfficialIncubo';
let currentRepo = 'BeatDrop-Music-Visualizer';

export const setTargetRepo = (owner: string, repo: string) => {
    currentOwner = owner;
    currentRepo = repo;
};

const getBaseUrl = () => `https://api.github.com/repos/${currentOwner}/${currentRepo}`;

export const fetchCommitHistory = async (limit: number = 7): Promise<GitCommit[]> => {
    try {
        const response = await fetch(`${getBaseUrl()}/commits?per_page=${limit}`);
        if (!response.ok) throw new Error(`Git history fetch failed: ${response.statusText}`);
        
        const data = await response.json();
        return data.map((item: any) => ({
            sha: item.sha,
            author: item.commit.author.name,
            date: item.commit.author.date,
            message: item.commit.message,
            url: item.html_url,
            avatarUrl: item.author?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        }));
    } catch (error) {
        console.error("Git Service Error:", error);
        throw error;
    }
};

export const fetchRepoStructure = async (): Promise<RepoFile[]> => {
    try {
        // Fetch the default branch first to get the correct tree SHA
        const repoInfo = await fetch(getBaseUrl()).then(res => res.json());
        const defaultBranch = repoInfo.default_branch || 'main';
        
        const response = await fetch(`${getBaseUrl()}/git/trees/${defaultBranch}?recursive=1`);
        if (!response.ok) throw new Error(`Repo structure fetch failed: ${response.statusText}`);
        
        const data = await response.json();
        return data.tree.map((file: any) => ({
            path: file.path,
            type: file.type,
            size: file.size,
            url: file.url
        }));
    } catch (error) {
        console.error("Repo Structure Error:", error);
        throw error;
    }
};

export const fetchFileContent = async (path: string): Promise<string> => {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${currentOwner}/${currentRepo}/HEAD/${path}`);
        if (!response.ok) throw new Error(`Failed to fetch file content: ${path}`);
        return await response.text();
    } catch (error) {
        console.error("File Content Error:", error);
        throw error;
    }
};

export const fetchDependencies = async (): Promise<DependencyData[]> => {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${currentOwner}/${currentRepo}/HEAD/package.json`);
        if (!response.ok) return []; 
        
        const pkg = await response.json();
        const deps: DependencyData[] = [];
        
        if (pkg.dependencies) {
            Object.entries(pkg.dependencies).forEach(([name, version]) => {
                deps.push({ name, version: version as string });
            });
        }
        if (pkg.devDependencies) {
            Object.entries(pkg.devDependencies).forEach(([name, version]) => {
                deps.push({ name, version: version as string, isDev: true });
            });
        }
        return deps;
    } catch (error) {
        console.error("Dependency Fetch Error:", error);
        return [];
    }
};

export const fetchBlameAnalysis = async (filePath: string): Promise<GitBlameLine[]> => {
    try {
        const response = await fetch(`${getBaseUrl()}/commits?path=${filePath}&per_page=1`);
        if (!response.ok) throw new Error(`Blame analysis failed: ${response.statusText}`);
        
        const commitData = await response.json();
        if (commitData.length === 0) throw new Error("No commit history found for this path.");
        
        const latestCommit = commitData[0];
        
        const content = await fetchFileContent(filePath);
        const lines = content.split('\n').slice(0, 50);

        return lines.map((line, index) => ({
            lineNumber: index + 1,
            author: latestCommit.commit.author.name,
            commitSha: latestCommit.sha.substring(0, 7),
            content: line,
            date: latestCommit.commit.author.date
        }));
    } catch (error) {
        console.error("Blame Service Error:", error);
        throw error;
    }
};

export const getRepoName = () => currentRepo;
export const getRepoOwner = () => currentOwner;
