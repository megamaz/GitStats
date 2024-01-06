export interface GitStatsElectronAPI {
  CheckRepoExists: (repo: string) => Promise<boolean>,
  SaveRepo: (repo: string) => Promise<boolean>,
  UpdateCurrentLoaded: (loaded: string) => Promise<void>
  GetCurrentLoaded: () => Promise<string>,
  GetSavedRepos: () => Promise<Array<string>>,
  PopulateIssueTable: (repo: string) => Promise<void>
}
export interface LoginAPI {
  TryLogin: (token: string) => Promise<boolean>
}

export interface SqlAPI {
  Run: (command: string, params?) => Promise<any>
}

export interface UtilitiesAPI {
  LoadURL: (url: string) => Promise<void>
  CreateChart: (canvas, data) => Promise<any>
}

declare global {
  interface Window {
    gitstats: GitStatsElectronAPI,
    login: LoginAPI,
    utilities: UtilitiesAPI,
    sql: SqlAPI
  }
}