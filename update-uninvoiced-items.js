const fs = require('fs');
const _ = require('lodash');
const axios = require('axios');

const URL = 'https://app.officernd.com/i/organizations/work-inn/payments' // replace with live url

axios.defaults.headers.cookie = 'connect.sid=...'; // replace with live cookie

const invoiceIds = ['65f1c74729ff9746627493fb']; //... invoiceIds to update fees/memberships periods, replace with customer invoices

function writeErrorToFile(message) {
    fs.appendFileSync('error.log', message + '\n');
}

async function waitFor(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function processInvoices() {
    for (const invoiceId of invoiceIds) {
        try {
            const response = await axios.get(`${URL}/${invoiceId}`);
            await processInvoice(response.data);
        } catch (err) {
            const errorMessage = `Error processing invoice: ${invoiceId} Error: ${err}`;
            console.log(errorMessage);
            writeErrorToFile(errorMessage);
        }
        await waitFor(300); // Wait for 0.3 seconds
    }
}

async function processInvoice(invoice) {
    if (invoice && invoice.lines) {
        const memberships = _.compact(_.map(invoice.lines, 'membership'));
        const fees = _.compact(_.map(invoice.lines, 'fee'));

        if (_.isEmpty(memberships) && _.isEmpty(fees)) return;

        await detachInvoice(invoice._id, memberships, fees); // needed first to make lines.memberships/fees -> null
        await updateInvoice(invoice._id, invoice.lines); // same invoice lines, in order to update the corresponding memberships/fees invoice periods
    }

}

async function detachInvoice(invoiceId, memberships, fees) {
    const body = [...memberships.map(membership => ({
        membership
    })), ...fees.map(fee => ({
        fee
    }))];

    await axios.post(`${URL}/${invoiceId}/detach`, body);
    console.log(`Invoice ${invoiceId} detached successfully with ${JSON.stringify(body)}`);
}

async function updateInvoice(invoiceId, lines) {
    try {
        await axios.put(`${URL}/${invoiceId}`, {
            lines
        });
        console.log(`Invoice ${invoiceId} updated successfully.`);
    } catch (error) {
        const errorMessage = `Error updating invoice ${invoiceId} with ${JSON.stringify(lines)}: ${error.message}`;
        console.error(errorMessage);
        writeErrorToFile(errorMessage);
    }
}

processInvoices();