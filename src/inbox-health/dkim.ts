import type { DomainParts } from '@/types';

//parses TXT record into an array
const buildItemsArray = (item: string): Record<string, string> => {
  var splittedItem = item.trim().split('=');
  var itemKey = splittedItem[0];
  var itemValue = splittedItem[1];
  return { [itemKey]: itemValue };
};

export function validateDkim(response: any) {
  if (response === undefined) {
    return {
      result: false,
      reason: 'unknown_response_from_server',
      dkimRecord: null,
    };
  }

  //validation rules
  const validationRules: {
    v: string;
    g: string;
    k: string;
    p: RegExp;
  } = {
    v: 'DKIM1',
    g: '*',
    k: 'rsa',
    p: /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/,
  };

  //get DKIM TXT record from result
  const dkimData = response[0][0].split(';');

  //parse it into an array
  const itemsArray = dkimData.map(buildItemsArray);

  let validationsErrors: Record<string, any> = {};

  itemsArray.forEach((item: Record<string, string>) => {
    var key = Object.keys(item)[0];
    var value = item[key];

    if (key !== 'p') {
      if (
        key in validationRules &&
        value !== validationRules[key as keyof typeof validationRules]
      ) {
        validationsErrors[key] = {
          found: value,
          shouldBe: validationRules[key as keyof typeof validationRules],
        };
      }
    } else {
      //public key regexp test
      if (validationRules.p.test(value) === false) {
        validationsErrors.p = { found: value, message: 'Invalid public key' };
      }
    }
  });

  if (Object.keys(validationsErrors).length === 0) {
    return {
      result: true,
      dkimData: itemsArray,
      dkimRecord: response[0][0],
    };
  }

  return {
    result: false,
    reason: 'invalid_dkim',
    dkimData: itemsArray,
    dkimRecord: response[0][0],
    validationsErrors: validationsErrors,
  };
}

export function constructGoogleDkimSelector(domain: DomainParts) {
  const d = domain.sub ? `${domain.sub}.${domain.domain}` : domain.domain;
  return `google._domainkey.${d}`;
}

/**
 *
 * @param domain
 * @returns
 */
export function constructOutlookDkimSelector(domain: DomainParts) {
  const d = domain.sub ? `${domain.sub}.${domain.domain}` : domain.domain;
  return `selector1._domainkey.${d}`;
}
