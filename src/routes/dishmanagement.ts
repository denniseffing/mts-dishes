import { Request, Response, Router as eRouter } from 'express';
import * as business from '../logic';
import * as dbtypes from '../model/database';
import * as types from '../model/interfaces';

export const router = eRouter();

router.post('/dish/search', (req: Request, res: Response) => {
    const random = Math.random();

    try {
        if (random <= 0.33) {
            throw { code: 502, message: 'Oops, I made an oopsiieee wooopsiee'}
        }

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
    const random = Math.random();

    try {
        if (random <= 0.33) {
            throw { code: 502, message: 'Oops, I made an oopsiieee wooopsiee'}
        }

        // get dish
        let dish = business.getDish(req.params.id);
        res.json(dish);
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
});

router.get('/ingredient/:ids', (req: Request, res: Response) => {
    const random = Math.random();

    try {
        if (random <= 0.33) {
            throw { code: 502, message: 'Oops, I made an oopsiieee wooopsiee'}
        }

        // get ingredients
        let ingredients = business.getIngredients(req.params.ids);
        res.json(ingredients);
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message });
    }
});