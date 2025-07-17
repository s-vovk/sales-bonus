/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет прибыли от операции
  const { discount, sale_price, quantity } = purchase;
  return sale_price * quantity * (1 - discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  const bonusMap = {
    0: 0.15,
    1: 0.1,
    2: 0.1,
    [total - 1]: 0,
  };
  const bonusPercent = bonusMap[index] ?? 0.05;
  return profit * bonusPercent;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.customers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.purchase_records) ||
    data.customers.length === 0 ||
    data.products.length === 0 ||
    data.sellers.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  if (!typeof options === "object") {
    throw new Error("Опции не переданы");
  }
  const { calculateRevenue, calculateBonus } = options;

  if (
    !typeof calculateRevenue === "function" ||
    !typeof calculateBonus === "function"
  ) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    // Заполним начальными данными
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = sellerStats.reduce(
    (result, seller) => ({ ...result, [seller.id]: seller }),
    {}
  );

  const productIndex = data.products.reduce(
    (result, product) => ({ ...result, [product.sku]: product }),
    {}
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж
    seller.sales_count += 1;
    // Увеличить общую сумму всех продаж
    seller.revenue += record.total_amount;

    // Расчёт прибыли для каждого товара
    record.items.forEach((sale) => {
      const product = productIndex[sale.sku]; // Товар

      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * sale.quantity;

      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(sale);

      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.profit += profit;

      // Учёт количества проданных товаров
      if (!seller.products_sold[sale.sku]) {
        seller.products_sold[sale.sku] = sale.quantity;
      } else {
        seller.products_sold[sale.sku] += sale.quantity;
      }
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    const { products_sold } = seller;
    // Object.entries => [ ['sku', 2], ['sku2', 1], ... ]
    seller.top_products = Object.entries(products_sold)
      .map((item) => ({ sku: item[0], quantity: item[1] }))
      // [ {sku: 'sku1', quantity: 2}, ... ]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map(
    ({ id, name, revenue, profit, sales_count, top_products, bonus }) => ({
      seller_id: id, // Строка, идентификатор продавца
      name, // Строка, имя продавца
      revenue: Number(revenue.toFixed(2)), // Число с двумя знаками после точки, выручка продавца
      profit: Number(profit.toFixed(2)), // Число с двумя знаками после точки, прибыль продавца
      sales_count, // Целое число, количество продаж продавца
      top_products, // Целое число, топ-10 товаров продавца
      bonus: Number(bonus.toFixed(2)), // Число с двумя знаками после точки, бонус продавца
    })
  );
}
