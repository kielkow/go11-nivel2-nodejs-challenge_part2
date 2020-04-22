import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

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

      if (value > total) throw new AppError('You reached your limit');
    }

    // Check category exists
    const categoriesRepository = getRepository(Category);

    const checkCategoryExists = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!checkCategoryExists) {
      const createCategoryService = new CreateCategoryService();

      const newCategory = await createCategoryService.execute({
        title: category,
      });

      const transaction = await transactionsRepository.save({
        title,
        value,
        type,
        category_id: newCategory.id,
      });

      return transaction;
    }

    const transaction = await transactionsRepository.save({
      title,
      value,
      type,
      category_id: checkCategoryExists.id,
    });

    return transaction;
  }
}

export default CreateTransactionService;
