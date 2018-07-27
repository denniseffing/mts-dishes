import { Request, Response, Router as eRouter } from 'express';
import * as business from '../logic';
import * as dbtypes from '../model/database';
import * as types from '../model/interfaces';

export const router = eRouter();

router.post('/dish/search', (req: Request, res: Response) => {
    try {
        // Check if body contains a valid filter
        if (!types.isFilterView(req.body)) {
            throw { code: 400, message: 'Invalid filter' };
        }

        // check filter values. Put the correct if neccessary
        business.checkFilter(req.body);

        // get the dishes
        business.getDishes(req.body, (err: types.Error | null, dishes: types.PaginatedList | undefined) => {
            if (err) {
                res.status(500).json({ message: err.message });
            } else {
                res.json(dishes);
            }
        });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
});

router.get('/dish/:id', (req: Request, res: Response) => {
    try {
        // get dish
        business.getDish(req.params.id).then((dish: any) => {
            res.json(dish[0]);
        }).catch(err => {
            res.status(500).json({ message: err.message });
        });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
});

router.get('/ingredient/:ids', (req: Request, res: Response) => {
    try {
        // get dish
        business.getIngredients(req.params.ids).then((ingredients: dbtypes.Ingredient[]) => {
            res.json(ingredients);
        }).catch(err => {
            res.status(500).json({ message: err.message });
        });
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
});