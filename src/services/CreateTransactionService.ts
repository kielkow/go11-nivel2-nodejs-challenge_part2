import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // Check transaction limit
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (value > total) throw new AppError('You reached your limit', 400);
    }

    // Check category exists
    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    // Create Transaction
    if (!checkCategoryExists) {
      const transactionCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(transactionCategory);

      const transaction = await transactionsRepository.save({
        title,
        value,
        type,
        category: transactionCategory,
      });

      delete transaction.category;

      return transaction;
    }

    const transaction = await transactionsRepository.save({
      title,
      value,
      type,
      category: checkCategoryExists,
    });

    delete transaction.category;

    return transaction;
  }
}

export default CreateTransactionService;
