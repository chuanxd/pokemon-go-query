import request from "request-promise";
import geolib from "geolib";
import { stringify } from "querystring";
import pokemon from "pokemon";
import moment from "moment";

const PkgetURL = "https://pkget.com/pkm333.ashx"

export function query(location, distance) {
  const [min, max] = geolib.getBoundsOfDistance(location, distance);
  const params = {
    v1: 111,
    v2: max.latitude,
    v3: max.longitude,
    v4: min.latitude,
    v5: min.longitude,
    v6: 0,
  };

  console.log(`-- curl "${PkgetURL}?${stringify(params)}" -H "X-Requested-With: XMLHttpRequest" -H "Referer: https://pkget.com/" --`);

  return request({
    url: `${PkgetURL}?${stringify(params)}`,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://pkget.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
    },
    gzip: true,
  })
  .then(res => {
      if (res.match(/^找/)) return [];
      const { pk123 } = JSON.parse(res);
      const now = moment().unix();
      const pokemons =
        pk123
          .map(({ d1, d3, d4, d5  }) => {
            let name = pokemon.getName(+d1, "zh-Hant");
            const latitude = +d4;
            const longitude = +d5;
            const vanish = +d3 / 1000;

            return {
              uuid: `${vanish}-${d1}-${latitude}-${longitude}`,
              id: +d1,
              lat: latitude,
              long: longitude,
              pokemon: name,
              type: 'pkget',
              dist: geolib.getDistance(location, { latitude, longitude }),
              remain:  moment.utc(0).seconds(vanish - now).format('mm:ss'),
              end: moment(+d3).utc(8).format('HH:mm'),
            };
          })
          .sort((a, b) => a.dist - b.dist);

      return pokemons;
    })
}
