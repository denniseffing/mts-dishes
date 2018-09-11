import * as _ from 'lodash';
import * as dbtypes from './model/database';
import * as types from './model/interfaces';
import * as util from './utils/utilFunctions';
import * as mockedData from './database/mockDatabase'

const maxPrice = 50;

/* #region Get dishes by criteria */
export function getDishes(
  filter: types.FilterView,
  callback: (err: types.Error | null, dishes?: types.PaginatedList) => void,
) {
  try {
    // filter by category
    const categoryCriteria: string[] | undefined =
      filter.categories === null ||
      filter.categories === undefined ||
      filter.categories.length === 0
        ? undefined
        : filter.categories.map(elem => elem.id.toString());

    let dishIdSet: Set<string> | undefined;

    // get the dish ids if we are filtering by category
    if (categoryCriteria) {
      const dishIdsByCriteria = mockedData.DishCategory
          // filter mappings that match our category criteria
          .filter((mapping: dbtypes.DishCategory) => _.includes(categoryCriteria, mapping.idCategory))
          .map((mapping: dbtypes.DishCategory) => mapping.idDish) as string[]; // map to dish ids

      dishIdSet = new Set(dishIdsByCriteria);
    }

    // if no dish was found for the
    if (dishIdSet && dishIdSet.size === 0) {
      callback(null, util.getPagination(0, 1, []));
      return;
    }

    // get dishes from database
    const ingredients: dbtypes.Ingredient[] = mockedData.Ingredient as dbtypes.Ingredient[];

    let dishes: types.DishesView[] = _.cloneDeep(mockedData.Dish)
    .filter(dish => {
      // console.log(dish);
      if (dishIdSet && dish.id) {
        return dishIdSet.has(dish["id"]);
      } else {
        return true;
      }
    })
    .filter(dish => {
      // console.log('TEST: ' +dish);
      if (filter.maxPrice && dish.price) {
        return dish.price <= filter.maxPrice;
      } else {
        return true;
      }
      // filter.maxPrice ? dish.price <= filter.maxPrice : true)
    })
    .filter(dish => {
          return (
            _.lowerCase(dish.name).includes(_.lowerCase(filter.searchBy)) ||
            _.lowerCase(dish.description).includes(_.lowerCase(filter.searchBy))
          );
        })
    .map(util.relationArrayOfIds(ingredients, 'extras', 'id'))
    .map(dishToDishesview()) as types.DishesView[];

    if (filter.sort !== undefined && filter.sort.length > 0) {
      dishes = _.orderBy(
        dishes,
        filter.sort.map((elem: types.SortByView) => 'dish.' + elem.name),
        filter.sort.map((elem: types.SortByView) =>
          _.lowerCase(elem.direction),
        ),
      );
    }

    callback(null, util.getPagination(500, 1, dishes));
  } catch (error) {
    console.error(error);
    callback({ code: 500, message: error.message });
  }
}
/* #endregion */

/* #region Get dish by id */
export function getDish(id: number): dbtypes.Dish | undefined {
  const dish = mockedData.Dish
  .find(dish => Number(dish.id) === Number(id));
  return dish;
}
/* #endregion */

/* #region Get ingredients by ids */
export function getIngredients(
  ids: number[],
): dbtypes.Ingredient[] {
  const test = mockedData.Ingredient
  .filter(ingredient => ids.includes(Number(ingredient.id)))
  return test;
}
/* #endregion */

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
      extras: element.extras.map(
        (elem: dbtypes.Ingredient): types.ExtraIngredientView => {
          return {
            id: Number(elem.id),
            description: elem.description,
            price: elem.price,
            name: elem.name,
          };
        },
      ),
    };
  };
}

/**
 * Check all params of FilterView and put the correct values if neccesary
 *
 * @param {types.IFilterView} filter
 * @returns
 */
export function checkFilter(filter: any) {
  filter.maxPrice =
    filter.maxPrice === undefined ||
    filter.maxPrice === null ||
    filter.maxPrice === ''
      ? maxPrice
      : filter.maxPrice;
  filter.minLikes =
    filter.minLikes === undefined ||
    filter.minLikes === null ||
    filter.minLikes === ''
      ? 0
      : filter.minLikes;
  filter.searchBy =
    filter.searchBy === undefined || filter.searchBy === null
      ? ''
      : filter.searchBy;
  filter.isFab =
    filter.isFab === undefined || filter.isFab === null ? false : filter.isFab;
  filter.sort =
    filter.sort === undefined ||
    filter.sort === null ||
    filter.sort.length === 0 ||
    filter.sort[0].name === null
      ? []
      : filter.sort;
  filter.showOrder =
    filter.showOrder === undefined || filter.showOrder === null
      ? 0
      : filter.showOrder;
  // filter.pagination = filter.pagination || {size: 10, page: 1, total: 1 };
}
