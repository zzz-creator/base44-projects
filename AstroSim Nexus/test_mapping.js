function toPascalCase(str) {
  if (str === 'id') return null; // Special case for ID
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

console.log('active_status ->', toPascalCase('active_status'));
console.log('technology_level ->', toPascalCase('technology_level'));
console.log('id ->', toPascalCase('id'));
console.log('name ->', toPascalCase('name'));
