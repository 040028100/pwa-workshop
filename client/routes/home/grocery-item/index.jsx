import React from 'react';

import './styles.scss';

function formatPrice(rawPrice) {
  return `$${rawPrice.toFixed(2)}`;
}

const GroceryItem = ({ item }) => {
  let itemUrl = `https://localhost:3100${item.imageUrl}`;
  let price = formatPrice(item.price);
  let unit = item.unit;
  return (
    <li className='GroceryItem mui-panel'>
      <img className='item-image' src={itemUrl} alt={item.name}/>
      <h4 className='item-name'>{item.name}</h4>
      <span className="item-price">
        {price}
        {unit ? <span className='item-unit'>{unit}</span> : ''}
      </span>
    </li>
  )
};

export default GroceryItem;