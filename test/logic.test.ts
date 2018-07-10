import * as config from '../src/config';
process.env.MODE = 'test';
process.env.PORT = config.TESTPORT.toString();

import * as chai from 'chai';
import * as _ from 'lodash';
import * as business from '../src/logic';
import * as types from '../src/model/interfaces';

const expect = chai.expect;
const should = chai.should();

describe('Testing the application logic', () => {
    before(() => {
        business.cleanDatabase();
        //silence the console
        // console.log = () => {};
        // console.error = () => {};
    });

    describe('getDishes', () => {
        it('should return all dishes if not filter is given', (done) => {
            const filter: types.FilterView = {
                categories: [],
            };

            business.getDishes(filter, (err, dishes) => {
                try {
                    should.not.exist(err);

                    expect(dishes).to.not.be.undefined;
                    expect(dishes!.result.length).to.be.equals(6);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('should return only some dishes if filter is given', (done) => {
            const filter: types.FilterView = {
                categories: [],
                searchBy: 'curry',
                maxPrice: 15,
                sort: [{ name: 'name', direction: 'ASC' }],
            };

            business.getDishes(filter, (err, dishes) => {
                try {
                    should.not.exist(err);

                    expect(dishes).to.not.be.undefined;
                    expect(dishes!.result.length).to.be.equals(1);
                    expect((dishes!.result[0] as types.DishesView).dish.name.toLowerCase()).to.be.equals('Thai Green Chicken Curry'.toLowerCase());
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    after(() => {
        // delete console.log;
        // delete console.error;
        business.cleanDatabase();
        process.env.MODE = undefined;
        process.env.PORT = undefined;
    });
});
