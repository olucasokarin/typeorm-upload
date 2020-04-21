import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
    title: string;
    type: 'income' | 'outcome';
    value: number;
    category: string;
}

class CreateTransactionService {
    public async execute({
        title,
        type,
        value,
        category,
    }: Request): Promise<Transaction> {
        const transactionRepository = getCustomRepository(
            TransactionRepository,
        );
        const categoryRepository = getRepository(Category);

        if (type === 'outcome') {
            const { total } = await transactionRepository.getBalance();
            if (value > total)
                throw new AppError('Valor extrapola o total', 400);
        }

        const checkCategoryExists = await categoryRepository.findOne({
            where: { title: category },
        });

        if (!checkCategoryExists) {
            const categoryNew = await categoryRepository.create({
                title: category,
            });
            await categoryRepository.save(categoryNew);

            const transaction = await transactionRepository.create({
                title,
                type,
                value,
                category_id: categoryNew.id,
                category: categoryNew,
            });
            await transactionRepository.save(transaction);
            return transaction;
        }

        const transaction = await transactionRepository.create({
            title,
            type,
            value,
            category_id: checkCategoryExists.id,
            category: checkCategoryExists,
        });
        await transactionRepository.save(transaction);
        return transaction;
    }
}

export default CreateTransactionService;
