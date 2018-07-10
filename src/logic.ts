import { NumberAttributeValue } from 'aws-sdk/clients/dynamodbstreams';
import { Credentials } from 'aws-sdk';
import { ActionConfigurationPropertyList } from 'aws-sdk/clients/codepipeline';
import { AccessControlPolicy } from 'aws-sdk/clients/s3';
import * as _ from 'lodash';
import dynamo from '@oasp/oasp4fn/dist/adapters/fn-dynamo';
import oasp4fn from '@oasp/oasp4fn';
import * as dbtypes from './model/database';
import * as types from './model/interfaces';
import * as util from './utils/utilFunctions';
import * as moment from 'moment';
import * as md5 from 'md5';
import { Mailer } from './utils/mailer';
import * as serverConfig from './config';

//? Dynamo
/*
const creds = new Credentials('akid', 'secret', 'session');
oasp4fn.setDB(dynamo, { endpoint: 'http://localhost:8000/', region: 'us-west-2', credentials: creds });*/
let creds;
if (!process.env.MODE || process.env.MODE!.trim() !== 'test') {
    creds = new Credentials('akid', 'secret', 'session');
    oasp4fn.setDB(dynamo, { endpoint: serverConfig.databaseURL, region: 'us-west-2', credentials: creds });
} else {
    creds = new Credentials('akid2', 'secret2', 'session2');
    oasp4fn.setDB(dynamo, { endpoint: serverConfig.databaseURL, region: 'us-west-2', credentials: creds });
}

const maxPrice = 50;

//! /////////////////// Dishes /////////////////////////////////////////////////////////////////////////////////////////
export async function getDishes(filter: types.FilterView,
                                callback: (err: types.Error | null, dishes?: types.PaginatedList) => void) {
    try {
        // filter by category
        const catId: string[] | undefined = (filter.categories === null || filter.categories === undefined || filter.categories.length === 0) ?
            undefined :
            filter.categories.map((elem) => elem.id.toString());

        let dishCategories: string[] = [];
        let dishIdSet: Set<string> | undefined;

        // get the dish ids if we are filtering by category
        if (catId) {
            const dishCatObject = await oasp4fn.table('DishCategory').
                filter((elem: dbtypes.DishCategory) => _.includes(catId, elem.idCategory)).
                reduce((acum: any, elem: any) => {
                    if (acum.hasOwnProperty(elem.idDish)) {
                        acum[elem.idDish].categories.push(elem.idCategory);
                    } else {
                        acum[elem.idDish] = { id: elem.idDish, categories: [elem.idCategory] };
                    }
                    return acum;
                }, {}).
                promise() as { [propName: string]: {}[] };

            dishCategories = _.filter(_.values(dishCatObject), _.matchesProperty('categories', catId)).map((elem: any) => elem.id);
            console.log(dishCategories);
            dishIdSet = new Set(dishCategories);

        }

        //? filter by fav
        //TODO: check if user is correct
        // if (filter.isFab) {
        //     const fav: dbtypes.User = await oasp4fn.table('User', '1').
        //         promise() as dbtypes.User;

        //     const s2: Set<string> = new Set(fav.favourites as string[]);

        //     dishIdSet = (dishIdSet !== undefined) ? util.setIntersection(dishIdSet, s2) : s2;
        // }

        // get dishes from database
        if (dishIdSet === undefined || dishIdSet.size > 0) {
            const ingredients: dbtypes.Ingredient[] = await oasp4fn.table('Ingredient').promise() as dbtypes.Ingredient[];

            let dishes: types.DishesView[] = await oasp4fn.
                table('Dish', (dishIdSet !== undefined) ? [...dishIdSet] : undefined).
                where('price', filter.maxPrice, '<=').
                filter((o: any) => {
                    return _.lowerCase(o.name).includes(_.lowerCase(filter.searchBy))
                        || _.lowerCase(o.description).includes(_.lowerCase(filter.searchBy));
                }).
                map(util.relationArrayOfIds(ingredients, 'extras', 'id')).
                map(dishToDishesview()).
                // orderBy(filter.sortBy[0].name, _.lowerCase(filter.sortBy[0].direction)).
                promise() as types.DishesView[];

            if (filter.sort !== undefined && filter.sort.length > 0) {
                dishes = _.orderBy(dishes, filter.sort.map((elem: types.SortByView) => 'dish.' + elem.name), filter.sort.map((elem: types.SortByView) => _.lowerCase(elem.direction)));
            }

            callback(null, util.getPagination(500, 1, dishes));
        } else {
            callback(null, util.getPagination(0, 1, []));
        }

    } catch (error) {
        console.error(error);
        callback({ code: 500, message: error.message });
    }
}

//! /////////////////// BOOKING /////////////////////////////////////////////////////////////////////////////////////////


//! //////////// AUX FUNCTIONS //////////////////////////////////////////////////////////////////
function dishToDishesview() {
    return (element: any): types.DishesView => {
        return {
            dish: {
                id: Number(element.id),
                name: element.name,
                description: element.description,
                price: element.price,
                imageId: 0,
            },
            image: element.image,
            extras: element.extras.map((elem: dbtypes.Ingredient): types.ExtraIngredientView => {
                return {
                    id: Number(elem.id),
                    description: elem.description,
                    price: elem.price,
                    name: elem.name,
                };
            }),
        };
    };
}

async function calculateVATandOrderName(orderLines: types.OrderLinesView[]): Promise<[number, string[]]> {
    let sum: number = 0;
    const names: string[] = [];

    const [dishes, extras] = await Promise.all([
        oasp4fn.table('Dish', orderLines.map((elem: types.OrderLinesView) => {
            return elem.orderLine.dishId.toString();
        })).
            reduce((acum: any, elem: any) => {
                acum[elem.id] = elem;
                return acum;
            }, {}).
            promise() as Promise<any>,
        oasp4fn.table('Ingredient').
            reduce((acum: any, elem: any) => {
                acum[elem.id] = elem;
                return acum;
            }, {}).
            promise() as Promise<any>,
    ]);

    orderLines.forEach((elem: types.OrderLinesView) => {
        let x = dishes[elem.orderLine.dishId.toString()].price;
        let name = elem.orderLine.amount + 'x ' + dishes[elem.orderLine.dishId.toString()].name + ' with ';
        elem.extras.forEach((elem2: types.ExtraIngredientView) => {
            x += extras[elem2.id.toString()].price;
            name += extras[elem2.id.toString()].name + ', ';
        });

        sum += x * elem.orderLine.amount;
        name = name.substring(0, name.length - 2);
        name += ' (' + x + '€)';

        names.push(name);
    });

    return [sum, names];
}

/**
 * Check all params of FilterView and put the correct values if neccesary
 *
 * @param {types.IFilterView} filter
 * @returns
 */
export function checkFilter(filter: any) {
    filter.maxPrice = (filter.maxPrice === undefined || filter.maxPrice === null || filter.maxPrice === '') ? maxPrice : filter.maxPrice;
    filter.minLikes = (filter.minLikes === undefined || filter.minLikes === null || filter.minLikes === '') ? 0 : filter.minLikes;
    filter.searchBy = (filter.searchBy === undefined || filter.searchBy === null) ? '' : filter.searchBy;
    filter.isFab = (filter.isFab === undefined || filter.isFab === null) ? false : filter.isFab;
    filter.sort = (filter.sort === undefined || filter.sort === null || filter.sort.length === 0 || filter.sort[0].name === null) ? [] : filter.sort;
    filter.showOrder = (filter.showOrder === undefined || filter.showOrder === null) ? 0 : filter.showOrder;
    // filter.pagination = filter.pagination || {size: 10, page: 1, total: 1 };
}

export async function undoChanges(operation: 'insert' | 'delete', table: string, object?: any) {
    let error = true;

    // retry 5 times
    for (let i = 0; error && i < 5; i++) {
        try {
            if (operation === 'insert') {
                if (object !== undefined) {
                    await oasp4fn.insert(table, object).promise();
                }
            } else if (operation === 'delete') {
                if (object !== undefined) {
                    await oasp4fn.delete(table, object).promise();
                }
            }

            error = false;
        } catch (error) {
            console.error(error);
        }
    }

    if (error) {
        console.error('SEVERAL ERROR: DATABASE MAY HAVE INCONSISTENT DATA!');
    }
}

export async function cleanDatabase() {
    await Promise.all(
        [
            oasp4fn.table('Booking').project('id').delete().promise(),
            oasp4fn.table('InvitedGuest').project('id').delete().promise(),
            oasp4fn.table('Order').project('id').delete().promise(),
        ]);
}
