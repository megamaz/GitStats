class UserData {
    usertoken:string
    loadedrepos:Array<string>
    graphs:Array<Graphs>
}

class Graphs {
    type:number
    data:GraphData
    url:string
    id:number
    repo:string
    labelData:LabelData
}

class GraphData {
    x:Array<string>
    y:Array<number>
}

type LabelData = {
    [label: string]: Array<number>
}