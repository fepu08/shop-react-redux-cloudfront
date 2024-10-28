#!/bin/bash
az storage blob upload-batch -s './dist' -d '$web' --account-name 'stgsandfrontendne008' --overwrite