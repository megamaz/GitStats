
let current_repo;

interface Issue {
    _number: number;
    _type: string;
    _state: boolean;
    _dateopen: number;
    _dateclose: number;
}

interface ExtraData {
    label: string,
    value: any
}

window.addEventListener('DOMContentLoaded', () => {
    OnStart();
});

// utility
function avg(a: number[]) {
    var sum = 0;
    a.forEach(n => {sum += n;});
    return sum / a.length;
}

// things to do immediatly on load
async function OnStart() {
    current_repo = await window.gitstats.GetCurrentLoaded();
    var header = document.getElementById("repoheader");
    var hyperlink_header = document.getElementById("linktorepo_header");
    
    header.innerText = `${current_repo}`;
    hyperlink_header.setAttribute("onclick", `window.utilities.shell.openExternal("https://github.com/${current_repo}");`)

}

function FetchAllIssues() {
    var p = document.createElement("p");
    p.id = "loading-text";
    p.innerText = "Populating issue table... Closing the app early will cause the table to be incomplete";
    document.body.appendChild(p);
    ToggleFormDisabled(true);
    window.gitstats.PopulateIssueTable(current_repo).then(() => {
        ToggleFormDisabled(false);
        document.body.removeChild(p);
    });
}

async function CreateIssueGraph() {
    // most of this code is extremely similar to v1.
    // We're grabbing the data, generating the graph data, then we'll ask main to give us a graph object which we'll shove into the page.

    var graph_label = "";
    // FILTERS
    var type_filter = <HTMLSelectElement>document.getElementById("type-filter");
    var label_filter = <HTMLInputElement>document.getElementById("label-filter");
    var assignee_filter = <HTMLInputElement>document.getElementById("assignee-filter");

    var all_filters = [];

    var has_label_filter = false;
    var has_assignee_filter = false;

    var label_count = 0;
    var assignee_count = 0;

    // get label IDs
    var label_ids = [];
    if(label_filter.value != '') {
        var label_id_querry = 'SELECT _id FROM labellist';
        var filters = [];
        label_filter.value.split(",").forEach(label => {
            if(label != '') {
                filters.push(`_label='${label}'`);
                label_count ++;
            }
        });
        label_id_querry += " WHERE " + filters.join(" OR ");
        
        console.log(label_id_querry);
        (await window.sql.Run(label_id_querry)).forEach(element => {
            label_ids.push(element._id);
        });
        all_filters.push(`labellink._id IN (${label_ids.toString()})`);
        has_label_filter = true;
    }

    // get assignee IDs
    var assignee_ids = [];
    if(assignee_filter.value != '') {
        var assignee_id_querry = 'SELECT _id FROM assigneelist';
        var filters = [];
        assignee_filter.value.split(",").forEach(assignee => {
            if(assignee != '') {
                filters.push(`_name='${assignee}'`);
                assignee_count ++;
            }
        });
        assignee_id_querry += " WHERE " + filters.join(" OR ");
        
        console.log(assignee_id_querry);
        (await window.sql.Run(assignee_id_querry)).forEach(element => {
            assignee_ids.push(element._id);
        });
        all_filters.push(`assigneelink._id IN (${assignee_ids.toString()})`);
        has_assignee_filter = true;
    }

    var type_value = type_filter.options[type_filter.selectedIndex].value;
    if(type_value != 'both') {
        all_filters.push(`_type='${type_value}'`);
    }

    var sql_querry = `SELECT * FROM issuelist`;
    if(all_filters.length != 0) {
        if(has_label_filter) {
            sql_querry += " INNER JOIN labellink ON issuelist._number=labellink._number";
        }
        if(has_assignee_filter) {
            sql_querry += " INNER JOIN assigneelink ON issuelist._number=assigneelink._number";
        }
        sql_querry += " WHERE " + all_filters.join(" AND ") + ` GROUP BY issuelist._number`;
        // thanks ChatGPT
        if(label_count != 0 || assignee_count != 0) {
            sql_querry += " HAVING "
            if(label_count != 0) {
                sql_querry += `COUNT(DISTINCT labellink._id) = ${label_count}`
            }
            if(label_count != 0 && assignee_count != 0)
                sql_querry += " AND "
            if(assignee_count != 0) {
                sql_querry += `COUNT(DISTINCT assigneelink._id) = ${assignee_count}`
            }
        }
    }

    sql_querry += " ORDER BY _dateopen";
    console.log(sql_querry);

    await window.sql.Run(`CREATE TABLE temptable AS ${sql_querry}`);
    var issue_data: Array<Issue> = await window.sql.Run('SELECT * FROM temptable');
    console.log(issue_data);
    // grabbing some extra data.
    var extra_data: ExtraData[] = [];
    var avg_open_time = []; // how long an issue stays open on average (this is an array of how long each issue stayed open, then it'll be averaged)
    var total_open = (await window.sql.Run("SELECT * FROM temptable WHERE _state=1")).length; // how many are open right now


    var labels = []; // graph X-axis
    var points = []; // graph Y-axis

    var oldest = issue_data[0];
    var newest = issue_data[issue_data.length - 1];

    var stepsize = ((newest._dateopen - oldest._dateopen) / 100);
    var steps = [];
    for (let i = oldest._dateopen; i < newest._dateopen; i += stepsize) {
        steps.push(i);
        labels.push(new Date(i*1000).toISOString().slice(0, 10));
    }

    var amount = 0; // amount of opened issues at any point
    var closes = []; // we need to remember the closes if an issue was opened in a timestep, but closed much much later down the line
    issue_data.forEach(issue => {
        // since we're dealing with timesteps, I have to count how many issues OPENED and CLOSED between each step.
        // for every issue, increase the amount by 1.
        amount++;

        // we need to save our closes (for the reason mentioned above)
        if (issue._dateclose != null) {
            avg_open_time.push(issue._dateclose - issue._dateopen);
            closes.push(issue._dateclose);
        }

        // now we need to check if the issue was closed in the latest timestep
        // if it was, we also need to remember that, in order to remove it from the closes list
        var toremove = [];
        closes.forEach(date_close => {
            if (date_close < steps[0]) {
                amount--;
                toremove.push(date_close);
            }
        });
        toremove.forEach(element => {
            let ind = closes.indexOf(element);
            closes.splice(ind, 1);
        })

        // if the issue was created after our current step, we need to save the current amount for our current step and move on to the next timestep
        while (issue._dateopen > steps[0]) {
            points.push(amount);
            steps.shift();
        }
    });
    // after all this, we now have our data!
    var data = {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: graph_label,
                    data: points,
                    tension: 0.5
                }
            ]
        }
    };

    // gen our extra data
    extra_data.push({
        label: "Average Time Open",
        value: new Date(avg(avg_open_time)*1000)
    });
    extra_data.push({
        label:"Total Open",
        value:total_open
    });
    CreateChartElementFromData(data, extra_data);

    // and now we can get rid of our temp table
    window.sql.Run("DROP TABLE temptable");
}

/**
 * @param chartjs_data - The ChartJS data that will be made into a grap.
 * @param extra_data - An array of ExtraData objects to append to the div. The data will be appended as <p>label: value</p>
 */
function CreateChartElementFromData(chartjs_data: Object, extra_data?: ExtraData[]) {
    var chart_div = document.createElement("div");
    var chart_canvas = document.createElement("canvas");
    var remove_button = document.createElement("button");
    remove_button.innerText = "Remove"
    remove_button.setAttribute("onclick", `this.parentNode.remove()`);

    chart_div.appendChild(remove_button);
    chart_div.appendChild(chart_canvas);
    chart_div.setAttribute("style", "border:1px solid black");
    if(extra_data !== undefined) {
        extra_data.forEach(element => {
            var newdata = document.createElement("p");
            newdata.innerText = `${element.label}: ${element.value}`
            chart_div.appendChild(newdata);
        });
    }

    document.body.appendChild(chart_div);

    window.utilities.CreateChart(chart_canvas, chartjs_data);
}

function ToggleFormDisabled(toggleto: boolean) {
    var stats_form = <HTMLFormElement>document.getElementById("stats");
    for (let i = 0; i < stats_form.elements.length; i++) {
        let element = stats_form.elements[i] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        element.disabled = toggleto;
    }
}