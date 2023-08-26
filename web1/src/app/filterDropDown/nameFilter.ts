import { Pipe, PipeTransform } from '@angular/core';

// purchase Page use this fillter
@Pipe({
    name: 'proditemfilter',
    pure: false
})
export class ProductNameFilter implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => item.Name.toLowerCase().includes(filter.toLowerCase()));
    }
}

@Pipe({
    name: 'proditemfilterPurchase',
    pure: false
})
export class ProductItemFilterPurchase implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        // filter items array, items which match and return true will be
        // kept, false will be filtered out
        return items.filter(item => item.TableValue.toLowerCase().includes(filter.toLowerCase()));
    }
}


// bill Page use this fillter
@Pipe({
    name: 'nameFilterS', 
    pure: false
})
export class NameFilterS implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => item.Name.toLowerCase().includes(filter.toLowerCase()));
    }
}

@Pipe({
    name: 'proditemfilterbill',
    pure: false
})
export class ProductItemFilterBill implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        // filter items array, items which match and return true will be
        // kept, false will be filtered out
        return items.filter(item => item.TableValue.toLowerCase().includes(filter.toLowerCase()));
    }
}


// purchase Page use this fillter
@Pipe({
    name: 'prodtypenamefilter',
    pure: false
})
export class ProductTypeNameFilter implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => item.Name.toLowerCase().includes(filter.toLowerCase()));
    }
}

@Pipe({
    name: 'prodmasteritemfilter',
    pure: false
})
export class ProductMasterItemFilter implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        // filter items array, items which match and return true will be
        // kept, false will be filtered out
        return items.filter(item => item.TableValue.toLowerCase().includes(filter.toLowerCase()));
    }
}
