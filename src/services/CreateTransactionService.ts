import { getRepository, getCustomRepository } from 'typeorm';
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
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('This type is invalid.');
    }

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Insufficient funds.');
    }

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id = null;

    if (checkCategoryExists) {
      category_id = checkCategoryExists.id;
    } else {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      category_id = newCategory.id;
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
