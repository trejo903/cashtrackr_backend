import {createRequest,createResponse} from 'node-mocks-http'
import Expense from '../../../models/Expense'
import { ExpensesController } from '../../../controllers/ExpenseController'
import { expenses } from '../../mocks/expenses'

jest.mock('../../../models/Expense',()=>({
    create:jest.fn()
}))

describe('ExpensesController.create',()=>{
    it('should create a new expense',async()=>{
        const expenseMock={
            save:jest.fn().mockResolvedValue(true)
        };

        (Expense.create as jest.Mock).mockResolvedValue(expenseMock)

        const req = createRequest({
            method:'POST',
            url:'/api/budgets/:budgetId/expenses',
            body:{name:'Test Expense',amount:500},
            budget:{id:1}
        })

        const res = createResponse();

        await ExpensesController.create(req,res)

        const data = res._getJSONData()
        expect(res.statusCode).toBe(201)
        expect(data).toEqual('Gasto agregado correctamente')
        expect(expenseMock.save).toHaveBeenCalled()
        expect(expenseMock.save).toHaveBeenCalledTimes(1)
        expect(Expense.create).toHaveBeenCalledWith(req.body)

    })
    it('should handle expense creation error',async()=>{
        const expenseMock={
            save:jest.fn()
        };

        (Expense.create as jest.Mock).mockRejectedValue(new Error)

        const req = createRequest({
            method:'POST',
            url:'/api/budgets/:budgetId/expenses',
            body:{name:'Test Expense',amount:500},
            budget:{id:1}
        })

        const res = createResponse();

        await ExpensesController.create(req,res)

        const data = res._getJSONData()
        expect(res.statusCode).toBe(500)
        expect(data).toEqual({error:'Hubo un error'})
        expect(expenseMock.save).not.toHaveBeenCalled()
        expect(Expense.create).toHaveBeenCalledWith(req.body)

    })
})

describe('ExpenseController.getById',()=>{
    it('should return expense with ID 1',async()=>{
        const req = createRequest({
            method:'POST',
            url:'/api/budgets/:budgetId/expenses/:expenseId',
            expense: expenses[0]
        })

        const res = createResponse();
        await ExpensesController.getById(req,res)
        const data = res._getJSONData()
        expect(res.statusCode).toBe(200)
        expect(data).toEqual(expenses[0])
    })
})

describe('ExpenseController.updateById',()=>{
    it('should handle expense update',async()=>{

        const expenseMock={
            ...expenses[0],
            update: jest.fn().mockResolvedValue(true)
        }

        const req = createRequest({
            method:'POST',
            url:'/api/budgets/:budgetId/expenses/:expenseId',
            expense: expenseMock,
            body:{name:'Update Expense ',amount:1000}
        })

        const res = createResponse();
        await ExpensesController.updateById(req,res)
        const data = res._getJSONData()
        expect(res.statusCode).toBe(200)
        expect(data).toEqual('Se actualizo correctamente')
        expect(expenseMock.update).toHaveBeenCalled()
        expect(expenseMock.update).toHaveBeenCalledTimes(1)
        expect(expenseMock.update).toHaveBeenCalledWith(req.body)
    })
})

describe('ExpenseController.deleteById',()=>{
    it('should delete expense and return a success message',async()=>{

        const expenseMock={
            ...expenses[0],
            destroy: jest.fn().mockResolvedValue(true)
        }

        const req = createRequest({
            method:'DELETE',
            url:'/api/budgets/:budgetId/expenses/:expenseId',
            expense: expenseMock
            
        })

        const res = createResponse();
        await ExpensesController.deleteById(req,res)
        const data = res._getJSONData()
        expect(res.statusCode).toBe(200)
        expect(data).toEqual('Gasto eliminado')
        expect(expenseMock.destroy).toHaveBeenCalled()
        expect(expenseMock.destroy).toHaveBeenCalledTimes(1)
        
    })
})