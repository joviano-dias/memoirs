# Memoirs
 ![Memoir Alert](blossomalert.png?raw=true "Memoir alert")

_Memoirs_ is a slack bot app that enables you to capture and announce events on slack
 
Every event is a `.yml` file, inside the [config](./src/config/) folder 

### Install 
`npm install`

### Run
| field  | description  |
|---|---|
| Locally against the test webhooks defined in `index.js` | `npm run-script local` |
| Against real config file `events` | `npm run-script live` | 

### Setup
1. Create a slack app via api.slack.com
2. Create an incoming webhook for the required channels in the slack app
3. Add a new file in the [config](./src/config/) dir for every event to include using the template

### Config file
#### fields
| field  | description  |
|---|---|
| event  | Every file has an event name e.g. `noenInc birthday list`  |
| description | Description of the file/event |
| enabled | `true` activates the config file |
| cron_schedule | Schedule when you want the alert(s) to show up. Cron [help](https://crontab.guru/) to make your own schedule |
| cron_timezone | Timezone for the cron schedule. Wikipedia [help](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) |
| slack_message | Slack message to trigger. Supports emoticons and newlines. Check section _slack messages_ |
| slack_webhook_urls | Slack webhook urls, trigger alert to every channel listed with the associated webhook |
| data_timezone | Timezone used for person data time comparisons |
| persons | List of people with names and dates. Note that date formats are [flexible](https://www.w3schools.com/js/js_date_formats.asp), and anything that `new Date()` accepts |

#### slack messages
Example message formats
 1. `"Work anniversary alert (${Years}y)\n *${Name}*, Cong-rat-uu-lations! :cupcake::party:"`
 2. `"Happy Birthday *${Name}*"`
 3. `"Happy Birthday *${Name}*, you were born on ${Date}"`

`slack_message` supports the following formatting guidelines

| Variable | meaning |
|---|---|
| `${Date}` | person's date | 
| `${Name}` | person's name |
| `${Years}` | years since date |
| `${Months}` | months since date |
| `${Hours}` | hours since date |
| `${Minutes}` | minutes since date |
| `${Seconds}` | seconds since date |



#### example config
```
event: Birthdays
description: alerts neonInc about birthdays
enabled: true

cron_schedule: 45 9 * * *
cron_timezone: Europe/London

slack_message: "_Work anniversary alert_, ${Years}y \n *${Name}*, Congratulations! :cupcake:"
slack_webhook_urls:
  - https://hooks.slack.com/services/example_webhook_channel_1
  - https://hooks.slack.com/services/example_webhook_channel_2

data_timezone: Europe/London
persons:
  - Joviano Dias : Sep 1 2020
  - Blossom Rains : Oct 4 2020
```

### Deployment
Once your setup with config `.yml` files is complete, deploy your app. 

Data and config can be updated either via
1. Updating/ Adding `.yml` config files and re-deploying the app
2. Any live data or config changes can be applied by calling `/rebuildData` (overwritten by `git push`)  

### Colors
```
#F6E1B8 #9FB39F #DBC385 #A97C50 #454D46 #293230
```

### Credits 
Icon licensed from [Icon Finder](https://www.iconfinder.com/icons/7137824/soft_plant_fiber_cotton_fluffy_flower_icon)

Authored by Joviano Dias while at [Springer Nature](https://www.springernature.com/gp), using [Node.js](https://nodejs.org/en/) and [Express](https://expressjs.com/)