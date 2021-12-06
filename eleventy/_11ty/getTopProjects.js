module.exports = function (collection) {
    let projects = collection.getAll().filter(function (item) {
        if ("tags" in item.data) {
            if (item.data.tags.includes('projects')) {
                return true;
            }
            return false;
        }
    });

    console.log(projects.length);

    return projects.reverse().slice(0, 6);
};