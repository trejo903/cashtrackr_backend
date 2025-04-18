import { Router } from "express";
import { BudgetController } from "../controllers/BudgetController";
import { handleInputErrors } from "../middleware/validation";
import { hasAccess, validateBudgetExist, validateBudgetId, validateBudgetInput } from "../middleware/budget";
import { ExpensesController } from "../controllers/ExpenseController";
import { belongsToBudget, validateExpenseExist, validateExpenseId, validateExpenseInput } from "../middleware/expense";
import { authenticate } from "../middleware/auth";

const router = Router()

router.use(authenticate)

router.param('budgetId',validateBudgetId)
router.param('budgetId',validateBudgetExist)
router.param('budgetId',hasAccess)

router.param('expenseId',validateExpenseId)
router.param('expenseId',validateExpenseExist)
router.param('expenseId',belongsToBudget)

router.get('/',BudgetController.getAll)
router.post('/',
    validateBudgetInput,
    handleInputErrors,
    BudgetController.create)


router.get('/:budgetId',
    BudgetController.getByID
)
router.put('/:budgetId',
    validateBudgetInput,
    handleInputErrors,
    BudgetController.updateByID)


router.delete('/:budgetId',
    BudgetController.deleteById
)




router.post('/:budgetId/expenses',
    validateExpenseInput,
    handleInputErrors,
    ExpensesController.create
)
router.get('/:budgetId/expenses/:expenseId',ExpensesController.getById)
router.put('/:budgetId/expenses/:expenseId',
    validateBudgetInput,
    handleInputErrors,    
    ExpensesController.updateById
)
router.delete('/:budgetId/expenses/:expenseId',ExpensesController.deleteById)

export default router