// @ts-check

module.exports = function (api) {

  const OrderItem = api.db.models['order-item'];
  const Order = api.db.models['order'];
  const CartItem = api.db.models['cart-item'];
  const GroceryItem = api.db.models['grocery-item'];

  // function divideCartWork(items, allPlainCartItems) {
  //   let toAdd = null;
  //   let toUpdate = null;
  //   let toRemove = null;

  //   let groceryIdsInDbCart = allPlainCartItems.map((x) => x.groceryItemId);
  //   let itemIds = items.map((i) => i.groceryItem.id);
  //   toAdd = items.filter((d) => groceryIdsInDbCart.indexOf(d.groceryItem.id) < 0);
  //   toUpdate = items.filter((d) => groceryIdsInDbCart.indexOf(d.groceryItem.id) >= 0);
  //   toRemove = groceryIdsInDbCart.filter((id) => itemIds.indexOf(id) < 0);

  //   return { toAdd, toUpdate, toRemove };
  // }

  // function addCartItems(items) {
  //   return Promise.all(items.map((item) => {
  //     return CartItem.findOrCreate({ where: { groceryItemId: item.groceryItem.id } }).then(([cartItem]) => {
  //       return cartItem.update({
  //         qty: item.qty
  //       });
  //     });
  //   }));
  // }

  return function (req, res) {
    
    let items = req.body.data;
    api.db.transaction(() => {
      return GroceryItem.findAll({where: {
        id: {
          $in: items.map((i) => i.groceryItem.id)
        }
      }}).then((groceryItems) => {
        if (groceryItems.length === 0) {
          return Promise.reject('No items in order!');
        }
        return Order.create({totalPrice: 0}).then((order) => {
          let totalPrice = 0;
          return Promise.all(groceryItems.map((groceryItem) => {
            let qty = (items.filter((i) => i.groceryItem.id === groceryItem.id)[0]).qty;
            totalPrice += qty * groceryItem.price;
            return OrderItem.create({
              groceryItemId: groceryItem.id,
              orderId: order.id,
              qty
            });
          })).then(() => {
            return order.update({
              totalPrice: 0.01 * Math.round(totalPrice * 100)
            });
          });
        });
      });
    }).then((o) => {
      return Order.find({where: {id: o.id}, include: [{
        model: OrderItem,
        as: 'orderItems',
        include: [{
          model: GroceryItem,
          as: 'groceryItem'
        }]
      }]});
    }).then((order) => {
      res.json({data: order.get({plain: true})});
    }).catch((err) => {
      res.json({ error: `Problem placing order: ${err}` });
    });
  }
}