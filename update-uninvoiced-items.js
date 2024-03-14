const _ = require('lodash');
const axios = require('axios');

axios.defaults.headers.cookie = 'connect.sid=...'; // replace with live cookie

const invoiceIds = ['65f1c74729ff9746627493fb']; //... invoiceIds to update fees/memberships periods, replace with customer invocies

async function processInvoices() {
    const chunkSize = 100;
    for (let i = 0; i < invoiceIds.length; i += chunkSize) {
        const chunkIds = invoiceIds.slice(i, i + chunkSize);
        const promises = chunkIds.map(invoiceId => axios.get(`https://staging.officernd.com/i/organizations/blago-testing-bookings/payments/${invoiceId}`)); // replace url
        const responses = await Promise.all(promises);
        for (const response of responses) {
            try {
                await processInvoice(response.data);
            } catch (err) {
                console.log('Error processing invoice:' + response.data._id + 'Error: ' + err);
            }
        }
    }
}

async function processInvoice(invoice) {
    if (invoice && invoice.lines) {
        const memberships = _.compact(_.map(invoice.lines, 'membership'));
        const fees = _.compact(_.map(invoice.lines, 'fee'));

        if (_.isEmpty(memberships) && _.isEmpty(fees)) return;

        // Execute POST and PUT requests
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

    await axios.post(`https://staging.officernd.com/i/organizations/blago-testing-bookings/payments/65f1c74729ff9746627493fb/detach`, body);
    console.log(`Invoice ${invoiceId} detached successfully with ${body}`);
}


async function updateInvoice(invoiceId, lines) {
    try {
        await axios.put(`https://staging.officernd.com/i/organizations/blago-testing-bookings/payments/${invoiceId}`, {
            lines
        });
        console.log(`Invoice ${invoiceId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating invoice ${invoiceId}: ${error.message}`);
    }
}

processInvoices();