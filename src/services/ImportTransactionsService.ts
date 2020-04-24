/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  csvFilename: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const transactionFilePath = path.join(uploadConfig.directory, csvFilename);

    /*
    const transactionFileExists = await fs.promises.stat(transactionFilePath);
    if (transactionFileExists) await fs.promises.unlink(transactionFilePath);
    */

    const readCSVStream = fs.createReadStream(transactionFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: any[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactions: Transaction[] = [];

    const createTransaction = new CreateTransactionService();

    for (const line of lines) {
      transactions.push(
        await createTransaction.execute({
          title: line[0],
          value: line[1],
          type: line[2],
          category: line[3],
        }),
      );
    }

    return transactions;
  }
}

export default ImportTransactionsService;
