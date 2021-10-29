const express = require('express')
const app = express()
const port = 8080
const fs = require('fs')
const favicon = require('serve-favicon')
const path = require("path")
const YAML = require('yaml')
const {IncomingWebhook} = require('@slack/webhook')
const CronJob = require('cron').CronJob
const {DateTime, Interval} = require("luxon")

let configData = {}
let configDir = path.join(__dirname, 'config')
let jobs = []

let myArgs = process.argv.slice(2)
let testWebhookUrls = ["https://hooks.slack.com/services/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"]

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.get('/', (req, res) => {
    res.sendStatus(200)
})

app.get('/getConfig', (req, res) => {
    res.send(configData)
})

app.get('/getConfig/:event', async function (req, res) {
    let event = req.params.event
    res.send(configData[event])
})

app.get('/alert/:event', async function (req, res) {
    let event = req.params.event

    try {
        res.status(200).send(alertOnEvent(event))
    } catch (e) {
        res.status(500).send('Something broke ' + e)
    }
})

// app.get('/alertAll', async function (req, res) {
//
//     try {
//         res.status(200).send(alertAll())
//     } catch (e) {
//         res.status(500).send('Something broke ' + e)
//     }
// })

app.get('/rebuildData', (req, res) => {
    try {
        buildDataAndConfig()
        res.send("Completed data and config update")
    } catch (e) {
        res.status(500).send('Something broke ' + e)
    }
})

function buildDataAndConfig() {
    jobs = []
    configData = {}
    fs.readdirSync(configDir).forEach(file => {
        const fileContents = fs.readFileSync(path.join(configDir, file), 'utf8')
        const fileYamlData = YAML.parse(fileContents)
        if (fileYamlData.enabled) {
            configData[fileYamlData.event] = fileYamlData
        }
    })
    scheduleJobs()
    startJobs()
}

function scheduleJobs() {
    getEvents().forEach(event => {
        jobs.push(new CronJob(getCronSchedule(event), function () {
            alertOnEvent(event)
        }, null, true, getCronTimezone(event)))
    })
}

function startJobs() {
    jobs.forEach(job => {
        job.start()
    })
}

const alertAll = () => {
    let persons_alerted = []
    try {
        getEvents().forEach((event) => {
            persons_alerted.push(alertPersons(event))
        })
    } catch (e) {
        return e.message
    }
    return persons_alerted
}

const alertOnEvent = (event) => {
    let persons_alerted = []
    try {
        persons_alerted = alertPersons(event)
    } catch (e) {
        return e.message
    }
    return persons_alerted
}


const getEvents = () => {
    return Object.keys(configData)
}

const getPersons = (event) => {
    return configData[event].persons
}

const getCronSchedule = (event) => {
    return configData[event].cron_schedule
}

const getCronTimezone = (event) => {
    return configData[event].cron_timezone
}

const getDataTimezone = (event) => {
    return configData[event].data_timezone
}

const getSlackWebhooks = (event) => {
    if (getEnv() === "local") {
        return testWebhookUrls
    }
    return configData[event].slack_webhook_urls
}

const getSlackMessage = (event) => {
    return configData[event].slack_message
}

function alertPersons(event) {
    let alerts_sent = []
    if (!configData[event])
        return "Config not found, or 'enabled' is set to false for the event" + event
    getPersons(event).forEach(person => {
        let person_name = Object.keys(person)
        let person_date = Object.values(person)

        if (isTodayInHistory(event, person_date)) {
            let message = composeSlackMessage(event, person_name, person_date)
            alerts_sent.push('Sent message [' + message + '] to webhook [' + getSlackWebhooks(event) + ']')
            alertSlack(message, getSlackWebhooks(event))
        }
    })
    return alerts_sent
}

function alertSlack(message, slack_webhook_urls) {
    if (getEnv() === "local") {
        slack_webhook_urls = testWebhookUrls
    }

    slack_webhook_urls.forEach((webhook_url) => {
        const webhook = new IncomingWebhook(webhook_url)
        webhook.send({
            text: message
        })
    })
}

const composeSlackMessage = (event, person_name, person_date) => {

    let composedMessage = getSlackMessage(event)
    let dateNow = DateTime.fromISO(new Date().toISOString(), {zone: getDataTimezone(event)})
    let personDate = DateTime.fromISO(new Date(person_date).toISOString(), {zone: getDataTimezone(event)})

    let i = Interval.fromDateTimes(personDate, dateNow)

    composedMessage = composedMessage.replaceAll('${Name}', person_name)
    composedMessage = composedMessage.replaceAll("${Date}", person_date)
    composedMessage = substituteTimeDiffsInMessage(composedMessage, i)
    return composedMessage
}

const isTodayInHistory = (event, someDate) => {

    let dateNow = DateTime.fromISO(new Date().toISOString(), {zone: getDataTimezone(event)})
    let dateSupplied = DateTime.fromISO(new Date(someDate).toISOString(), {zone: getDataTimezone(event)})
    let i = Interval.fromDateTimes(dateSupplied, dateNow)

    return dateSupplied.day === dateNow.day &&
        dateSupplied.month === dateNow.month
}

const substituteTimeDiffsInMessage = (composedMessage, i) => {

    let message = composedMessage
    message = message.replaceAll("${Years}", Math.round(i.length('years')).toString())
    message = message.replaceAll("${Months}", Math.round(i.length('months')).toString())
    message = message.replaceAll("${Days}", Math.round(i.length('days')).toString())
    message = message.replaceAll("${Hours}", Math.round(i.length('hours')).toString())
    message = message.replaceAll("${Minutes}", Math.round(i.length('minutes')).toString())
    message = message.replaceAll("${Seconds}", Math.round(i.length('seconds')).toString())
    return message

}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', {error: err})
}

const getEnv = () => {
    return (myArgs[0])
}

app.listen(port, () => {
    buildDataAndConfig()
    console.log(`Memoirs slack app listening at http://localhost:${port}`)
})
