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
    const transactionFileExists = await fs.promises.stat(transactionFilePath);

    if (transactionFileExists) await fs.promises.unlink(transactionFilePath);

    const readCSVStream = fs.createReadStream(csvFilename);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: any[] = [];
    const transactions: Transaction[] = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    lines.map(async line => {
      const createTransaction = new CreateTransactionService();

      const trasaction = await createTransaction.execute({
        title: line[0],
        value: line[1],
        type: line[2],
        category: line[3],
      });

      transactions.push(trasaction);
    });

    return transactions;
  }
}

export default ImportTransactionsService;
