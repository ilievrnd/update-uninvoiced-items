# Fix uninvoiced items
The purpose of this script is to fix uninvoiced in system memberhsips and fees, but already having created invoices. In the end of the script:
 - created invoices should have no changes
 - their corresponding memberhips and fees should become invoiced (having set in their objects correct period and invoice)
 - all errors will be written to a file error.log 

## Prerequisites

Make sure to change the status of the live organization you are going to work with to **Demo** before starting the script. This will make it possible to update paid invoices. Change it back to **Active** after finishing.

## How It Works

 - fetch invoices by id from a predifined array
 - for each invoice:
   - execute detach request with all memberships/fees in the invoice
   - execute update request with same lines as initial one (this will correct the line items periods)
