
export class UserData {
    usertoken:string
    loadedrepos:Array<string>
    graphs:Array<Graphs>

    static default = {
        usertoken:"no_token_set",
        thiloadedrepos:[],
        graphs:[]
    }
}

export class Graphs {
    type:number
    data:GraphData
    url:string
    id:number
    repo:string
    labelData:LabelData
}

export class GraphData {
    x:Array<string>
    y:Array<number>
}

export type LabelData = {
    [label: string]: Array<number>
}

module.exports = {
    UserData: UserData
}